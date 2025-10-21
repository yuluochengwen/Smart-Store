def format_price(price):
    """格式化价格为两位小数"""
    return f"{price:.2f}"

def format_date(date):
    """格式化日期为YYYY-MM-DD"""
    return date.strftime('%Y-%m-%d')