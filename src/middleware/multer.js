import multer from "multer"

import fs from "node:fs"
export const multer_local = ({ custom_path: custom_path = "General", custom_type: custom_types = [] }) => {
    const full_path = `upload/${custom_path}`
    // check if path already exist if didn't create it 

    if (!fs.existsSync(full_path)) {
        fs.mkdirSync(full_path, { recursive: true })
    }


    const storage = multer.diskStorage({

        destination: function (req, file, cb) {
            cb(null, full_path)
        },
        filename: function (req, file, cb) {
            // console.log("before", file);

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, uniqueSuffix + "__" + file.originalname)
        }
    })


    function fileFilter(req, file, cb) {

        if (!custom_types.includes(file.mimetype))
            cb(new Error('Invalid File Type'))
        else
            cb(null, true)
    }

    const upload = multer({ storage, fileFilter })
    // if you didn't pass storage store in memory storage 
    return upload
}
export const multer_host = ({ custom_type: custom_types = [] }) => {


    const storage = multer.diskStorage({})


    function fileFilter(req, file, cb) {

        if (!custom_types.includes(file.mimetype))
            cb(new Error('Invalid File Type'))
        else
            cb(null, true)
    }

    const upload = multer({ storage, fileFilter })
    // if you didn't pass storage store in memory storage 
    return upload
}