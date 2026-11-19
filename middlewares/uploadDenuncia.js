
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pastaUploads = path.join(
    __dirname,
    "..",
    "public",
    "uploads"
);

fs.mkdirSync(pastaUploads, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, pastaUploads);
    },

    filename: (_req, file, cb) => {
        const extensao = path.extname(file.originalname);

        const nomeSeguro = path
            .basename(file.originalname, extensao)
            .replace(/[^a-zA-Z0-9_-]/g, "_");

        cb(null, `${Date.now()}-${nomeSeguro}${extensao}`);
    }
});

const upload = multer({
    storage,

    limits: {
        files: 10,
        fileSize: 20 * 1024 * 1024
    },

    fileFilter: (_req, file, cb) => {
        if (
            file.mimetype.startsWith("image/") ||
            file.mimetype.startsWith("video/")
        ) {
            return cb(null, true);
        }

        cb(new Error("Apenas imagens e vídeos são permitidos."));
    }
});

module.exports = upload;
