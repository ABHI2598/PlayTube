class ApiError extends Error
{
    constructor(statusCode, message="Something Went Wrong", errors=[], stack="" )
    {
        this.statusCode = statusCode
        this.message=message
        this.success=false
        this.data=null
        this.errors = errors
        if(stack)
        {
            this.stack =stack
        }
        else{
            Error.captureStackTrace(this,this.constructor);
        }

    }

}

module.exports={
    ApiError,
}

// The Error.captureStackTrace() method is a Node.js-specific feature that allows you to capture and customize the stack trace of an error object. It's commonly used within custom error classes to improve error handling and debugging by providing more informative stack traces. 
// Here's what Error.captureStackTrace(this, this.constructor) does:
// this: Refers to the current error object instance.
// this.constructor: Refers to the constructor function of the current error object instance.
// The Error.captureStackTrace() method captures the current stack trace and attaches it to the error object. By passing this as the first argument, it specifies that the stack trace should be captured for the current error object instance. The second argument, this.constructor, specifies where the capture should begin. This means that the stack trace will start from the constructor function of the current error object.