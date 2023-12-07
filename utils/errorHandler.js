class ErrorHandler extends Error{
    constructor(message, statusCode){
        super(message); //calling error class constructor
        this.statusCode = statusCode; //save in this errorHandler
    }
}

export default ErrorHandler