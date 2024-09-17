class ApiError extends Error {
    constructor(
        statusCode,
        message = "somthing went wrong!!",
        statct = "",
        errors = []
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.errors = errors
        this.success = false

        if (statct) {
            this.statct = statct
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}