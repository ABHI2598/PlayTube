//This Handler takes a function as paramter which again returns a function which commonly known as currying/function composition in js 
//Promise.resolve(requestHandler(req,res,next)) This line immediately invokes requestHandler with the req, res, and next parameters. Promise.resolve() is used to wrap the result of requestHandler in a Promise. This is done to ensure that requestHandler returns a Promise, regardless of whether it's originally asynchronous or synchronous.

const asyncHandler = (requestHandler) => (req,res,next) => {
     Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err));
} 

module.exports={
    asyncHandler
}
