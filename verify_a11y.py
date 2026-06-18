import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # Step 1: Navigate to the app setup/login and set appropriate localStorage to bypass it.
        await page.goto("http://localhost:4173")

        # Inject state to bypass Setup & Login
        # In useAppState.jsx we see localStorage is checking 'appSettings', 'appAuth', etc.
        app_settings = '{"scriptUrl":"https://script.google.com/macros/s/something/exec","sheetId":"1","folderId":"1","firebaseEnabled":true,"firebaseConfig":{"apiKey":"test","authDomain":"test","projectId":"test","storageBucket":"test","messagingSenderId":"test","appId":"test"},"sheetMirrorEnabled":false}'
        app_auth = '{"user":{"id":"test","name":"Test User","role":"admin"},"token":"fake-token"}'

        await page.evaluate(f"localStorage.setItem('appSettings', '{app_settings}');")
        await page.evaluate(f"localStorage.setItem('appAuth', '{app_auth}');")

        # Reload page so the injected state applies and we enter the dashboard
        await page.reload()

        # Wait a moment for rendering
        await asyncio.sleep(3)
        await page.screenshot(path="debug3.png")

        # Toggle the sidebar if it isn't visible
        try:
            # First try the toggle menu button
            await page.click("button[aria-label='Toggle menu']", timeout=3000)
            await asyncio.sleep(1)
        except Exception as e:
            print(f"Could not click Toggle menu: {e}")

        await page.screenshot(path="debug4.png")

        # Click the "Change Password" button in the sidebar (we know its inner text or aria-label might not be distinct, let's look for "Change Password")
        try:
            await page.click("text=Change Password", timeout=3000)
            await asyncio.sleep(1)
        except Exception as e:
            print(f"Could not click Change Password: {e}")

        # Capture modal state
        await page.screenshot(path="a11y_verify.png")

        # Start video recording just in case
        context = await browser.new_context(record_video_dir="videos/")
        page = await context.new_page()

        await page.goto("http://localhost:4173")
        await page.evaluate(f"localStorage.setItem('appSettings', '{app_settings}');")
        await page.evaluate(f"localStorage.setItem('appAuth', '{app_auth}');")
        await page.reload()
        await asyncio.sleep(2)

        try:
            await page.click("button[aria-label='Toggle menu']", timeout=3000)
            await asyncio.sleep(1)
            await page.click("text=Change Password", timeout=3000)
            await asyncio.sleep(1)
            # Try hovering over one of the buttons we patched
            await page.hover("button[aria-label='Toggle current password visibility']", timeout=3000)
            await asyncio.sleep(1)
        except Exception:
            pass

        await context.close()
        await browser.close()
        print("Done. Check debug3.png, debug4.png, a11y_verify.png and videos/")

asyncio.run(run())
