const db = require("../db/dbConnect");

class Denuncias {
    static async readAllGaragem(){
        console.log("denuncias.model.js", "readAllDenuncias()");
        const query = "select date_format(data, '%d/%m/%y') data, ; ";
        return db.executarQuery(query);
    }
}

Denuncias.readAllDenuncias();

module.exports = Denuncias;