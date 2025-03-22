// const asyncHandler = (requestHandler) => {
//     (req, res, next) => {
//         Promise
//         .resolve(
//             requestHandler(req, res, next)
//         ).catch(
//             (error) => next(error)
//         )
//     }
// }

// 



const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.error("Error in asyncHandler:", error);
        res.status(Number(error.statusCode) || 500).json({  //here i used error.code so had to change that. and was also getting error bcz changed in schema to all camel casing. and that again created new indexes. so have to delete old one to get rid from error code 11000. 
            success: false,
            message: error.message || "Internal Server Error"
        });

    }
}

export { asyncHandler }


// this wrapper will ease our life alot. we will need this so much and each time
// this will save this much line of cluttery code.