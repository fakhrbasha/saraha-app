import joi from 'joi'

export const validation = (schema) => {
    return (req, res, next) => {

        // console.log(Object.keys(schema));
        let error_result = []
        for (const key of Object.keys(schema)) {
            const { error } = schema[key].validate(req[key], { abortEarly: false })
            if (error) {
                error.details.forEach(element => {
                    error_result.push({
                        key,
                        path: element.path[0],
                        message: element.message
                    })
                })
            }
        }
        if (error_result.length) {
            return res.status(400).json({ message: "validation error", error: error_result })
        }
        next()
    }
}

// export const validate = (schema, property = "body") => {
//     return (req, res, next) => {
//         const data = req[property]
//         const { error, value } = joi.object(data, { abortEarly: false })
//         if (error) {
//             return res.status(400).json({ message: "error", error })
//         }
//         req[property] = value
//         next()
//     }
// }