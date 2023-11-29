const mongoose = require("mongoose");

const CodeBlockSchema = new mongoose.Schema({
    title: String,
    code: String,
    solution: String
}, { collection: 'codeblocks' });

const CodeBlock = mongoose.model('CodeBlock', CodeBlockSchema);

module.exports = CodeBlock;