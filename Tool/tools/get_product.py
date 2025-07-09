from Tool import register_tool
import os
import re

def parse_sql_products():
    """解析 SQL 檔案中的商品資料"""
    sql_backup_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'inkslap-backup.sql')

    if not os.path.exists(sql_backup_path):
        print(f"警告：找不到 SQL 備份檔案 {sql_backup_path}")
        return []

    try:
        with open(sql_backup_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 解析商品資料
        products = []
        categories = {}
        product_categories = {}
        product_images = {}

        # 先解析分類資料
        category_pattern = r"INSERT INTO `categories`.*?VALUES\s*(.*?);"
        category_match = re.search(category_pattern, content, re.DOTALL)
        if category_match:
            category_values = category_match.group(1)
            # 解析每一行分類資料
            category_lines = re.findall(r'\(([^)]+)\)', category_values)
            for line in category_lines:
                parts = [part.strip().strip("'\"") for part in line.split(',')]
                if len(parts) >= 2:
                    cat_id = int(parts[0])
                    cat_name = parts[1]
                    categories[cat_id] = cat_name

        # 解析商品分類關聯
        pc_pattern = r"INSERT INTO `product_categories`.*?VALUES\s*(.*?);"
        pc_match = re.search(pc_pattern, content, re.DOTALL)
        if pc_match:
            pc_values = pc_match.group(1)
            pc_lines = re.findall(r'\(([^)]+)\)', pc_values)
            for line in pc_lines:
                parts = [part.strip().strip("'\"") for part in line.split(',')]
                if len(parts) >= 4:
                    product_id = int(parts[2])
                    category_id = int(parts[3])
                    if product_id not in product_categories:
                        product_categories[product_id] = []
                    if category_id in categories:
                        product_categories[product_id].append(categories[category_id])

        # 解析商品圖片
        image_pattern = r"INSERT INTO `product_images`.*?VALUES\s*(.*?);"
        image_match = re.search(image_pattern, content, re.DOTALL)
        if image_match:
            image_values = image_match.group(1)
            image_lines = re.findall(r'\(([^)]+)\)', image_values)
            for line in image_lines:
                parts = [part.strip().strip("'\"") for part in line.split(',')]
                if len(parts) >= 9:
                    product_id = int(parts[1])
                    file_name = parts[3]
                    is_primary = int(parts[4]) == 1
                    image_type = parts[7]  # cover, template, other
                    file_path = parts[9] if parts[9] != 'NULL' else None

                    if product_id not in product_images:
                        product_images[product_id] = []

                    product_images[product_id].append({
                        'file_name': file_name,
                        'is_primary': is_primary,
                        'image_type': image_type,
                        'file_path': file_path
                    })

        # 解析商品資料
        product_pattern = r"INSERT INTO `products`.*?VALUES\s*(.*?);"
        product_match = re.search(product_pattern, content, re.DOTALL)
        if product_match:
            product_values = product_match.group(1)
            # 使用更精確的正則表達式來解析商品資料
            product_lines = re.findall(r'\(([^)]+(?:\([^)]*\)[^)]*)*)\)', product_values)

            for line in product_lines:
                try:
                    # 手動解析，因為商品資料包含複雜的 JSON 和特殊字符
                    parts = []
                    current_part = ""
                    in_quotes = False
                    quote_char = None
                    paren_count = 0

                    i = 0
                    while i < len(line):
                        char = line[i]

                        if char in ["'", '"'] and (i == 0 or line[i-1] != '\\'):
                            if not in_quotes:
                                in_quotes = True
                                quote_char = char
                            elif char == quote_char:
                                in_quotes = False
                                quote_char = None
                        elif char == '{' and not in_quotes:
                            paren_count += 1
                        elif char == '}' and not in_quotes:
                            paren_count -= 1
                        elif char == ',' and not in_quotes and paren_count == 0:
                            parts.append(current_part.strip())
                            current_part = ""
                            i += 1
                            continue

                        current_part += char
                        i += 1

                    if current_part.strip():
                        parts.append(current_part.strip())

                    if len(parts) >= 5:
                        product_id = int(parts[0])
                        code = parts[1].strip("'\"")
                        name = parts[2].strip("'\"")
                        description = parts[3].strip("'\"") if parts[3] != 'NULL' else ''
                        price = float(parts[4])

                        # 獲取規格信息
                        specification = ''
                        if len(parts) > 15 and parts[15] != 'NULL':
                            specification = parts[15].strip("'\"").replace('\\r\\n', ' ')

                        # 獲取最小最大訂購量
                        min_qty = int(parts[12]) if len(parts) > 12 and parts[12] != 'NULL' else 1
                        max_qty = int(parts[13]) if len(parts) > 13 and parts[13] != 'NULL' else 10000

                        # 獲取分類
                        product_cats = product_categories.get(product_id, ['生活雜貨'])

                        # 獲取圖片（優先選擇封面圖）
                        product_imgs = product_images.get(product_id, [])
                        cover_image = None
                        if product_imgs:
                            # 優先選擇封面圖
                            cover_imgs = [img for img in product_imgs if img['image_type'] == 'cover']
                            if cover_imgs:
                                cover_image = cover_imgs[0]['file_name']
                            else:
                                # 如果沒有封面圖，選擇第一張圖片
                                cover_image = product_imgs[0]['file_name']

                        products.append({
                            'id': product_id,
                            'code': code,
                            'name': name,
                            'description': description,
                            'price': price,
                            'specification': specification,
                            'min_order_quantity': min_qty,
                            'max_order_quantity': max_qty,
                            'categories': product_cats,
                            'image': cover_image,
                            'images': product_imgs
                        })

                except Exception as e:
                    print(f"解析商品資料時出錯: {e}")
                    continue

        print(f"成功解析 {len(products)} 個商品")
        return products

    except Exception as e:
        print(f"解析 SQL 檔案失敗: {e}")
        return []

# 從 SQL 檔案載入商品資料
SQL_PRODUCTS = parse_sql_products()

# 備用商品資料（如果資料庫不可用）
PRODUCTS = [
    {
        "name": "電鍍圓珠筆",
        "category": ["文具", "辦公用品", "配件飾品"],
        "price": 20.00,
        "spec": "黑筆芯,藍筆芯",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "PU束繩記事本",
        "category": ["文具", "辦公用品", "生活雜貨"],
        "price": 200.00,
        "spec": "A5",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "不銹鋼杯",
        "category": ["杯瓶餐具", "生活雜貨", "家居"],
        "price": 160.00,
        "spec": "300ml, ",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "珪藻土折疊墊",
        "category": ["家居", "生活雜貨", "杯瓶餐具"],
        "price": 300.00,
        "spec": "30x40cm",
        "min_quantity": 100,
        "max_quantity": 3000
    },
    {
        "name": "黑桃木相框",
        "category": ["家居", "生活雜貨", "配件飾品", "春節"],
        "price": 160.00,
        "spec": "5吋",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "密碼鎖收納包",
        "category": ["包袋收納", "生活雜貨", "配件飾品"],
        "price": 250.00,
        "spec": "牛津布",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "中型收納箱",
        "category": ["包袋收納", "家居", "生活雜貨"],
        "price": 400.00,
        "spec": "中型",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "鋁製筆筒",
        "category": ["辦公用品", "文具", "生活雜貨"],
        "price": 180.00,
        "spec": "圓",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "皮革筆袋",
        "category": ["文具", "配件飾品", "生活雜貨"],
        "price": 50.00,
        "spec": "隨身款",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "帆布托特包",
        "category": ["包袋收納", "生活雜貨", "配件飾品"],
        "price": 160.00,
        "spec": "帆布",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "皮革鑰匙圈",
        "category": ["配件飾品", "生活雜貨"],
        "price": 25.00,
        "spec": "單一規格",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "皮革隨身鏡",
        "category": ["配件飾品", "生活雜貨"],
        "price": 25.00,
        "spec": "單一規格",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "行李吊牌",
        "category": ["配件飾品", "包袋收納", "生活雜貨"],
        "price": 40.00,
        "spec": "皮革",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "短襪",
        "category": ["衣物配件", "生活雜貨"],
        "price": 135.00,
        "spec": "短襪",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "毛帽",
        "category": ["衣物配件", "生活雜貨"],
        "price": 170.00,
        "spec": "反折",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "帆布零錢包",
        "category": ["包袋收納", "配件飾品", "生活雜貨"],
        "price": 95.00,
        "spec": "帆布",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "棒球帽",
        "category": ["衣物配件", "配件飾品", "生活雜貨"],
        "price": 160.00,
        "spec": "金屬釦調節",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "直傘",
        "category": ["生活雜貨", "配件飾品"],
        "price": 220.00,
        "spec": "直傘",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "手動折疊傘",
        "category": ["生活雜貨", "配件飾品"],
        "price": 230.00,
        "spec": "手動",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "金屬圓珠筆",
        "category": ["文具", "辦公用品"],
        "price": 25.00,
        "spec": "單一規格",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "商務金屬圓珠筆",
        "category": ["文具", "辦公用品"],
        "price": 25.00,
        "spec": "單一規格",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "INKSLAP 筆記本",
        "category": ["文具", "辦公用品", "生活雜貨"],
        "price": 250.00,
        "spec": "印刷",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "環保杯 800mL ",
        "category": ["杯瓶餐具", "生活雜貨", "家居", "環保"],
        "price": 750.00,
        "spec": "環保材質,不銹鋼",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "帥氣Hoodie",
        "category": ["衣物配件", "生活雜貨"],
        "price": 600.00,
        "spec": "不織布",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "衛浴三件組",
        "category": ["家居", "生活雜貨"],
        "price": 400.00,
        "spec": "三件組",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "燈芯絨兩用包",
        "category": ["包袋收納", "生活雜貨"],
        "price": 300.00,
        "spec": "燈芯絨",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "網格收納包",
        "category": ["包袋收納", "生活雜貨"],
        "price": 130.00,
        "spec": "雙面斜紋布",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "針織毛帽",
        "category": ["衣物配件", "生活雜貨"],
        "price": 270.00,
        "spec": "大布標",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "舒眠眼罩",
        "category": ["配件飾品", "生活雜貨"],
        "price": 230.00,
        "spec": "單一規格",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "寬頭牙刷",
        "category": ["生活雜貨", "家居"],
        "price": 25.00,
        "spec": "配色",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "不鏽鋼便當盒",
        "category": ["杯瓶餐具", "家居", "生活雜貨"],
        "price": 510.00,
        "spec": "單一規格",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "環保便當盒",
        "category": ["杯瓶餐具", "家居", "生活雜貨", "環保"],
        "price": 95.00,
        "spec": "單一規格附餐具",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "矽膠保鮮便當盒",
        "category": ["杯瓶餐具", "家居", "生活雜貨"],
        "price": 200.00,
        "spec": "食用級矽膠",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "藝術玻璃花瓶",
        "category": ["家居", "生活雜貨", "配件飾品"],
        "price": 225.00,
        "spec": "長款",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "藝術玻璃花瓶",
        "category": ["家居", "生活雜貨", "配件飾品"],
        "price": 225.00,
        "spec": "短款",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "壓克力繽紛杯墊",
        "category": ["杯瓶餐具", "生活雜貨", "家居", "春節"],
        "price": 30.00,
        "spec": "直徑9.8cm",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "黑胡桃禪風卵石杯墊",
        "category": ["杯瓶餐具", "生活雜貨", "家居", "春節"],
        "price": 270.00,
        "spec": "大",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "黑胡桃置物盤",
        "category": ["家居", "生活雜貨", "中秋節", "端午節"],
        "price": 610.00,
        "spec": "小型",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "莫蘭迪硅膠餐墊",
        "category": ["杯瓶餐具", "生活雜貨", "家居", "中秋節", "端午節"],
        "price": 50.00,
        "spec": "直徑16cm",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "磁吸拼圖餐墊",
        "category": ["杯瓶餐具", "生活雜貨", "家居", "中秋節", "端午節"],
        "price": 140.00,
        "spec": "拼圖三件組",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "環保洗碗布",
        "category": ["家居", "生活雜貨", "杯瓶餐具", "中秋節", "端午節", "環保"],
        "price": 40.00,
        "spec": "19x19cm",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "筷子",
        "category": ["杯瓶餐具", "家居", "生活雜貨", "中秋節", "端午節", "春節", "台灣特色"],
        "price": 40.00,
        "spec": "單一規格",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "便條紙",
        "category": ["文具", "辦公用品"],
        "price": 14.00,
        "spec": "單一規格",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "皮革文件夾",
        "category": ["文具", "辦公用品"],
        "price": 90.00,
        "spec": "單一規格",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "環保中性筆",
        "category": ["文具", "辦公用品", "環保"],
        "price": 45.00,
        "spec": "黑色筆芯",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "堆堆中性筆",
        "category": ["文具", "辦公用品"],
        "price": 45.00,
        "spec": "黑色筆芯",
        "min_quantity": 1,
        "max_quantity": 10
    },
    {
        "name": "原字筆",
        "category": ["文具", "辦公用品"],
        "price": 50.00,
        "spec": "黑筆芯",
        "min_quantity": 1,
        "max_quantity": 10
    }
]




# 同義詞字典 - 用於擴充搜尋關鍵字
SYNONYMS = {
    "辦公": ["辦公用品", "文具", "商務"],
    "辦公小物": ["文具", "辦公用品", "商務用品"],
    "生活": ["生活雜貨", "家居", "日用品"],
    "生活用品": ["生活雜貨", "家居", "日用品"],
    "收納": ["包袋收納", "整理", "儲物"],
    "包包": ["包袋收納", "袋子", "背包"],
    "杯子": ["杯瓶餐具", "水杯", "茶杯"],
    "餐具": ["杯瓶餐具", "用餐", "廚具"],
    "衣服": ["衣物配件", "服裝", "穿搭"],
    "配件": ["配件飾品", "裝飾", "飾品"],
    "送男友": ["男性", "男士", "紳士"],
    "送女友": ["女性", "女士", "淑女"],
    "療癒系": ["舒壓", "放鬆", "可愛"],
    "科技感": ["現代", "時尚", "高科技"],
    "環保": ["綠色", "永續", "生態"],
    "春節": ["新年", "過年", "年節"],
    "中秋": ["中秋節", "月餅", "團圓"],
    "端午": ["端午節", "粽子"],
    "台灣": ["台灣特色", "本土", "在地"],
    # 新增趣味和創意相關關鍵字
    "整人": ["趣味", "搞笑", "惡搞", "創意", "有趣"],
    "趣味": ["有趣", "好玩", "創意", "搞笑", "新奇"],
    "趣味小物": ["有趣", "好玩", "創意", "小物", "新奇"],
    "搞笑": ["幽默", "有趣", "好玩", "創意"],
    "創意": ["新奇", "特別", "獨特", "有趣"],
    "新奇": ["特別", "創意", "獨特", "有趣"],
    "小物": ["小東西", "小商品", "配件", "用品"],
    "禮物": ["禮品", "贈品", "禮贈品"],
    "實用": ["好用", "方便", "便利", "功能性"],
    # 新增帽子相關關鍵字
    "帽子": ["帽", "棒球帽", "毛帽", "針織帽"],
    "帽": ["帽子", "棒球帽", "毛帽", "針織帽"],
    "棒球帽": ["帽子", "帽", "運動帽"],
    "毛帽": ["帽子", "帽", "針織帽", "保暖帽"],
    "針織帽": ["毛帽", "帽子", "帽", "保暖帽"],
    # 新增更多常見關鍵字
    "筆": ["圓珠筆", "金屬筆", "文具", "辦公用品"],
    "圓珠筆": ["筆", "文具", "辦公用品"],
    "記事本": ["筆記本", "文具", "辦公用品"],
    "筆記本": ["記事本", "文具", "辦公用品"],
    "零錢包": ["包", "錢包", "包袋收納"],
    "錢包": ["零錢包", "包", "包袋收納"],
    "托特包": ["包", "袋子", "包袋收納"],
    "網格包": ["包", "收納包", "包袋收納"]
}

def expand_keywords(keyword):
    """擴充關鍵字，加入同義詞"""
    expanded = [keyword.lower()]

    # 檢查是否有同義詞
    for key, synonyms in SYNONYMS.items():
        if key in keyword.lower():
            expanded.extend([s.lower() for s in synonyms])
        elif keyword.lower() in [s.lower() for s in synonyms]:
            expanded.append(key.lower())
            expanded.extend([s.lower() for s in synonyms])

    return list(set(expanded))  # 去重

@register_tool()
def get_product(
    category: str = None,
    min_price: float = None,
    max_price: float = None,
    min_quantity: int = None,
    max_quantity: int = None
) -> str:
    """
    根據類別、價格、最大最小購買數量回傳符合條件的產品列表。

    :param category: 產品類別
    :param min_price: 最低價格
    :param max_price: 最高價格
    :param min_quantity: 最小起訂數
    :param max_quantity: 最大可訂數
    :return: 符合條件的產品列表，以HTML表格格式返回
    """
    if not category and min_price is None and max_price is None and min_quantity is None and max_quantity is None:
        raise ValueError("You need to provide at least one parameter with value.")

    # 優先使用從 SQL 解析的資料
    results = SQL_PRODUCTS if SQL_PRODUCTS else PRODUCTS

    # 篩選條件
    filtered_results = []
    for product in results:
        # 處理 SQL 資料格式和備用資料格式的差異
        if 'categories' in product:
            # SQL 資料格式
            product_categories = product['categories']
            product_price = product['price']
            product_min_qty = product['min_order_quantity']
            product_max_qty = product['max_order_quantity']
        else:
            # 備用資料格式
            product_categories = product['category']
            product_price = product['price']
            product_min_qty = product.get('min_quantity', 1)
            product_max_qty = product.get('max_quantity', 10000)

        # 分類篩選 - 更寬鬆的匹配邏輯
        if category:
            category_match = False

            # 擴展關鍵字匹配
            search_terms = []
            if '包袋收納' in category.lower():
                search_terms = ['包', '袋', '收納', '箱', '盒']
            elif '包' in category.lower():
                search_terms = ['包', '袋']
            elif '收納' in category.lower():
                search_terms = ['收納', '箱', '盒', '包', '袋']
            else:
                search_terms = [category.lower()]

            # 檢查商品名稱和分類
            for term in search_terms:
                # 檢查商品名稱
                if term in product['name'].lower():
                    category_match = True
                    break
                # 檢查分類
                for cat in product_categories:
                    if term in cat.lower():
                        category_match = True
                        break
                if category_match:
                    break

            if not category_match:
                continue

        # 價格篩選
        if min_price is not None and product_price < min_price:
            continue
        if max_price is not None and product_price > max_price:
            continue

        # 數量篩選
        if min_quantity is not None and product_min_qty > min_quantity:
            continue
        if max_quantity is not None and product_max_qty < max_quantity:
            continue

        filtered_results.append(product)

    if not filtered_results:
        return "<p>很抱歉，沒有找到符合條件的商品。請調整您的搜尋條件。</p>"

    # 格式化為HTML表格
    html_content = """<table>
<tr><th>商品名稱</th><th>單價</th><th>簡要描述</th></tr>"""

    for product in filtered_results[:6]:  # 顯示最多6個商品
        name = product['name']
        price = f"NT${int(product['price'])}"

        # 獲取描述
        if 'specification' in product:
            # SQL 資料格式
            description = product['specification'] or product['description'] or ''
        else:
            # 備用資料格式
            description = product.get('spec', '')

        # 清理描述文字
        description = description.replace('\\r\\n', ' ').replace('\r\n', ' ')[:50]
        if len(description) > 50:
            description = description[:47] + '...'

        html_content += f"""<tr><td>{name}</td><td>{price}</td><td>{description}</td></tr>"""

    html_content += "</table>"

    if len(filtered_results) > 6:
        html_content += f"<p>還有 {len(filtered_results) - 6} 個其他選擇，如需查看更多商品請告訴我！</p>"

    return html_content


@register_tool()
def search_products_by_keyword(keyword: str) -> str:
    """
    根據關鍵字進行模糊搜尋，支援多欄位搜尋和同義詞擴充。

    :param keyword: 搜尋關鍵字
    :return: 符合條件的產品列表，以HTML表格格式返回
    """
    if not keyword or keyword.strip() == '':
        return "<p>請提供搜尋關鍵字</p>"

    # 擴充關鍵字
    expanded_keywords = expand_keywords(keyword.strip())

    # 使用 SQL 資料或備用資料進行搜尋
    source_products = SQL_PRODUCTS if SQL_PRODUCTS else PRODUCTS
    results = []

    for product in source_products:
        match_score = 0

        # 處理不同資料格式
        if 'categories' in product:
            # SQL 資料格式
            product_categories = product['categories']
            product_spec = product['specification'] or product['description'] or ''
        else:
            # 備用資料格式
            product_categories = product['category']
            product_spec = product.get('spec', '')

        # 搜尋商品名稱
        for exp_keyword in expanded_keywords:
            if exp_keyword.lower() in product["name"].lower():
                match_score += 3

        # 搜尋分類
        for category in product_categories:
            for exp_keyword in expanded_keywords:
                if exp_keyword.lower() in category.lower():
                    match_score += 2

        # 搜尋規格描述
        for exp_keyword in expanded_keywords:
            if exp_keyword.lower() in product_spec.lower():
                match_score += 1

        if match_score > 0:
            product_with_score = product.copy()
            product_with_score["match_score"] = match_score
            results.append(product_with_score)

    # 按匹配分數排序
    results.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    if not results:
        return f"<p>抱歉，找不到符合「{keyword}」的贈品😢<br>可以試試其他關鍵字，例如「生活用品」、「療癒系」、「科技感」等～</p>"

    # 格式化為HTML表格
    html_content = f"<p>以下是符合「{keyword}」的搜尋結果：</p>\n"
    html_content += """<table>
<tr><th>商品名稱</th><th>單價</th><th>簡要描述</th></tr>"""

    for product in results[:6]:  # 顯示最多6個商品
        name = product['name']
        price = f"NT${int(product['price'])}"

        # 獲取描述
        if 'specification' in product:
            # SQL 資料格式
            description = product['specification'] or product['description'] or ''
        else:
            # 備用資料格式
            description = product.get('spec', '')

        # 清理描述文字
        description = description.replace('\\r\\n', ' ').replace('\r\n', ' ')[:50]
        if len(description) > 50:
            description = description[:47] + '...'

        html_content += f"""<tr><td>{name}</td><td>{price}</td><td>{description}</td></tr>"""

    html_content += "</table>"

    if len(results) > 6:
        html_content += f"<p>還有 {len(results) - 6} 個其他選擇，如需查看更多商品請告訴我！</p>"

    return html_content

