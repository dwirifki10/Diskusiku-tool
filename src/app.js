const express = require('express');
const router = require('./routes/router');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api', router);
app.use(cors());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
