import asyncio
from backend.etl.scrapers.quality_api_client import QualityAPIClient

async def main():
    client = QualityAPIClient()
    year = 2026
    
    print(f"--- Results for Year {year} ---")
    
    # 1. fetch_revenue_monthly
    try:
        rev_monthly = await client.fetch_revenue_monthly(year)
        # Handle if it's a list or dict
        if isinstance(rev_monthly, dict):
            items_count = len(rev_monthly)
            months = sorted(rev_monthly.keys())
            zero_vals = any(v == 0 for v in rev_monthly.values())
        elif isinstance(rev_monthly, list):
            items_count = len(rev_monthly)
            # Assuming list of dicts with 'mes' and 'valor'
            months = sorted([item.get('mes') for item in rev_monthly if 'mes' in item])
            zero_vals = any(item.get('valor') == 0 for item in rev_monthly if 'valor' in item)
        else:
            items_count = 0
            months = []
            zero_vals = False
            
        print(f"fetch_revenue_monthly: {items_count} items")
        print(f"  Months present: {months}")
        print(f"  Zero values present: {'Yes' if zero_vals else 'No'}")
    except Exception as e:
        print(f"fetch_revenue_monthly error: {e}")

    # 2. fetch_revenue_detailing
    try:
        rev_detailing = await client.fetch_revenue_detailing(year)
        print(f"fetch_revenue_detailing: {len(rev_detailing)} items")
    except Exception as e:
        print(f"fetch_revenue_detailing error: {e}")

    # 3. fetch_despesas_annual
    try:
        desp_annual = await client.fetch_despesas_annual(year)
        print(f"fetch_despesas_annual: {len(desp_annual)} items")
    except Exception as e:
        print(f"fetch_despesas_annual error: {e}")

    # 4. fetch_despesas_natureza
    try:
        desp_natureza = await client.fetch_despesas_natureza(year)
        print(f"fetch_despesas_natureza: {len(desp_natureza)} items")
    except Exception as e:
        print(f"fetch_despesas_natureza error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
