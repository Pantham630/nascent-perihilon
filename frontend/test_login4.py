from playwright.sync_api import sync_playwright
import json

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:8080')
        try:
            page.fill('input[type="email"]', 'alex@company.com')
            page.fill('input[type="password"]', 'Password123')
            page.click('button:has-text("Initiate Authentication")')
            page.wait_for_timeout(3000)
            
            error_text = page.locator('.text-red-300').text_content()
            stack_text = page.locator('.text-slate-400').text_content()
            
            output = {
                "error": error_text,
                "stack": stack_text
            }
            print(json.dumps(output))
        except Exception as e:
            print(json.dumps({"playwright_error": str(e)}))
        finally:
            browser.close()

if __name__ == '__main__':
    run()
