package com.sperger.portal

import android.util.Log

object Logger {
    private const val TAG = "Sperger-Portal"

    fun d(message: String) {
        Log.d(TAG, message)
    }

    fun e(message: String, throwable: Throwable? = null) {
        Log.e(TAG, message, throwable)
    }

    fun i(message: String) {
        Log.i(TAG, message)
    }
}
