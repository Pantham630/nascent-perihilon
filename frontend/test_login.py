from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.on('console', lambda msg: print(f'CONSOLE: {msg.type} {msg.text}'))
        page.on('pageerror', lambda exc: print(f'ERROR: {exc}'))
        page.goto('http://localhost:8080')
        try:
            page.fill('input[type="email"]', 'alex@company.com')
            page.fill('input[type="password"]', 'Password123')
            page.click('button:has-text("Secure Auth Sequence")')
            page.wait_for_timeout(5000)
            page.screenshot(path="screenshot.png")
        except Exception as e:
            print("Action failed", e)
        finally:
            browser.close()

if __name__ == '__main__':
    run()
