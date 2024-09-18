class ApiError extends Error {
    constructor(
        statusCode,
        message = "somthing went wrong!!",
        stack = "",
        errors = []
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.errors = errors
        this.success = false

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}