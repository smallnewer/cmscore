{
    "collection": "user",
    "schema" : {
        "name" : {
            type: "string",
            required: true,
            unique: true
        },
        "password" : {
            type: "string",
            required: true
        }
    }
}