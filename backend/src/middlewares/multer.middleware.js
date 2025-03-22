import multer from "multer"

const storage = multer.diskStorage( //You're using disk storage, which temporarily saves the file on the server's disk.
    //it have 2 attributes. destination & filename.
    {
        destination: function(req, file, cb){ //The destination defines where the file should be temporarily stored.

            cb(null, "./public/temp")//later handle the case if there is no temp directory.
        },
        filename: function(req, file, cb){
            cb(null, file.originalname)  //Saving files with their original names is fine but could cause conflicts if two files have the same name. 
            //improve later.
        }
    }
)


export const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } //10mb
}); //Good Practice: Set a limit on the file size to prevent excessively large uploads.