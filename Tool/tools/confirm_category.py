from Tool import register_tool

PRODUCTS = [
    {"id": 1, "name": "高質感筆記本", "category": "文具", "price": 120},
    {"id": 2, "name": "無線滑鼠", "category": "電子", "price": 450},
    {"id": 3, "name": "隨行保溫杯", "category": "生活", "price": 380},
    {"id": 4, "name": "皮質筆袋", "category": "文具", "price": 250},
    {"id": 5, "name": "LED 檯燈", "category": "家電", "price": 800},
    {"id": 6, "name": "磁吸手機支架", "category": "電子", "price": 300},
    {"id": 7, "name": "手工香氛蠟燭", "category": "生活", "price": 600},
    {"id": 8, "name": "自動鉛筆", "category": "文具", "price": 60},
    {"id": 9, "name": "USB 充電器", "category": "電子", "price": 250},
    {"id": 10, "name": "摺疊雨傘", "category": "生活", "price": 500},
]
CATEGORY_LIST = [
    "文具",
    "辦公用品",
    "杯瓶餐具",
    "包袋收納",
    "配件飾品",
    "衣物配件",
    "生活雜貨",
    "家居",
    "春節", "中秋節", "端午節", "台灣特色"
]

@register_tool()
def confirm_category(category: str) -> str:
    """
    查詢是否有此類別
    """
    if category in CATEGORY_LIST:
        return f"類別「{category}」存在於產品資料中。"
    else:
        return f"找不到類別「{category}」，請確認輸入是否正確。"
