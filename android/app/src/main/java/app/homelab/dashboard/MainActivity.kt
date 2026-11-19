// Dashboard — Android app (WebView) for the MY HOMELAB project
// Built by Playback71, with the help of Claude (Anthropic) — November 2026

package app.homelab.dashboard

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    // Your dashboard address — CHANGE this line to point at your own dashboard
    private val dashboardUrl = "http://192.168.1.30:8085/"

    private lateinit var web: WebView

    private val errorPage = """
        <html><body style="background:#000;color:#fff;font-family:sans-serif;
        text-align:center;padding:48px 24px;font-size:20px">
        <h2 style="color:#FFD400">Dashboard unavailable</h2>
        <p>Check that the phone is on your home Wi-Fi.</p>
        <p><a href="$dashboardUrl" style="color:#fff;font-size:24px">Retry</a></p>
        </body></html>
    """.trimIndent()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.setBackgroundColor(Color.BLACK)
        setContentView(web)

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true   // needed for localStorage (the Supervision page settings)
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        web.webViewClient = object : WebViewClient() {
            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                if (request.isForMainFrame) {
                    view.loadDataWithBaseURL(null, errorPage, "text/html", "utf-8", null)
                }
            }
        }

        if (savedInstanceState == null) web.loadUrl(dashboardUrl) else web.restoreState(savedInstanceState)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }
}
