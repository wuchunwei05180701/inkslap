from Tool import register_tool

@register_tool()
def get_category() -> str:
    """
    查詢所有類別
    """
    return f'目前有的類別:"文具","辦公用品","杯瓶餐具","包袋收納","配件飾品","衣物配件","生活雜貨","家居", "春節", "中秋節", "端午節", "台灣特色"'

