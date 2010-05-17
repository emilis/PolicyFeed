
var db = loadObject("DB");
var new_db = loadObject("ctl/JsonStorage");
// original_id to new added_id:
exports.oid2addid = {};
// original_id to doc_id:
exports.oid2did = {};


exports.migrate = function() {

    print(new Date());
    this.docs();

    /*
    print(new Date());
    this.originals();

    print(new Date());
    this.create_listings();

    print(new Date());
    this.comments();
    */

    print(new Date());
}

exports.docs = function() {

    var sql = "select * from docs order by published asc";

    var rs = db.query(sql);
    if (!rs.first())
        return false;

    rs.beforeFirst();
    while (rs.next())
    {
        var doc = db.get_row(rs);
        try {
            var data = JSON.parse(doc.meta);
        } catch (e) {
            print(doc.meta);
            print(e);
        }

        data.id = doc.id;
        data.original_id = doc.original_id;
        data.updated = doc.updated;
        data.published = doc.published;
        data.comment_count = doc.comment_count;
        data.html = doc.html;

        var id = doc.published.substr(0, 10).replace(/-/g, "/") + "/" + doc.original_id + "/doc";

        new_db.write(id, data);

        /*
        // new document:
        var sql = "insert into docs (id, comment_count) values(?,?)";
        var added_id = db_new.prepared_query(sql, [doc.id, doc.comment_count]);

        // update original_id indexes:
        this.oid2did[doc.original_id] = doc.id;
        this.oid2addid[doc.original_id] = added_id;

        // revision:
        var revision = doc.meta;
        revision.original_id = doc.original_id;
        revision.updated = doc.updated;
        revision.published = doc.published;
        revision.html = doc.html;

        sql = "insert into convertions (doc_id, body) values(?,?)";
        
        revision.id = db_new.prepared_query(sql, [doc.id, JSON.stringify(revision)]);;

        // add revision to document
        sql = "update docs set convertion=? where added_id=?";
        db_new.prepared_query(sql, [revision.id, added_id]);
        */
    }

    rs.getStatement().close();
}


exports.originals = function() {
    var sql = "select * from originals";

    var rs = db.query(sql);

    if (!rs.first())
        return false;

    rs.beforeFirst();
    while (rs.next()) {
        var original = db.get_row(rs);
        original.meta = JSON.parse(original.meta);

        // revision:
        var revision = original.meta;
        revision.updated = original.updated;
        revision.published = original.published;
        revision.source = original.source;
        revision.url = original.url;
        revision.html = original.html;

        sql = "insert into originals (doc_id, body) values(?,?)";
        revision.id = db_new.prepared_query(sql, [ this.oid2did[original.id], JSON.stringify(revision) ]);

        // add revision to document
        sql = "update docs set original=? where added_id=?";
        db_new.prepared_query(sql, [ revision.id, this.oid2addid[original.id] ]);
    }

    rs.getStatement().close();

}



exports.create_listings = function() {
    
    var sql = "select docs.id as doc_id, docs.convertion as convertion, convertions.created as updated, convertions.body as body, docs.comment_count as comment_count from docs, convertions where convertions.id = docs.convertion";

    var rs = db_new.query(sql);
    if (!rs.first())
        return false;

    rs.beforeFirst();
    while (rs.next())
    {
        var doc = db_new.get_row(rs);
        doc.body= JSON.parse(doc.body);

        var sql = "insert into doc_listing (doc_id, convertion, published, updated, title, source, comment_count) values(?,?,?,?,?,?,?)";

        if (doc.body.title.length > 255)
            doc.body.title = doc.body.title.substr(0, 252) + "...";

        db_new.prepared_query(sql, [doc.doc_id, doc.convertion, doc.body.published, doc.updated, doc.body.title, doc.body.short_source, doc.comment_count] );
    }

    rs.getStatement().close();
}


exports.comments = function() {

    var sql=" insert into policyfeed.comments (updated, parent_id, thread_id, author, user_id, score, text) (select updated, parent_id, thread_id, author, user_id, score, text from govsrvr.comments)";

    return db_new.query(sql);
}
