# first create folder structure and connection DB

```js
import mongoose from 'mongoose';

const checkConnectionDb = async () => {
  await mongoose
    .connect('mongodb://localhost:27017/sarahaApp', {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log('connected to DB');
    })
    .catch((err) => {
      console.log('error connecting to DB', err);
    });
};

export default checkConnectionDb;
```

---

- `app.controller.js`

```js
import express from 'express';
import checkConnectionDb from './DB/connectionDB.js';
const app = express();
const port = 3000;

const bootstrap = () => {
  app.use(express.json());
  checkConnectionDb();
  app.get('/', (req, res) => {
    return res.status(200).json({ message: 'Welcome to Saraha App' });
  });

  app.use('{/*demo}', (req, res, next) => {
    return res
      .status(404)
      .json({ message: `Url ${req.originalUrl} not found` });
  });

  app.listen(port, () => console.log(`app listening on port ${port}!`));
};
export default bootstrap;
```

- then make `userModel`
- make in your mind in model have `schema` and `model`

```js
const userSchema = new mongoose.Schema({}, {});
```

- first argument is the structure of the document in the collection
- second argument is the options of the schema
- the most important option is timestamps : true which will add two fields to the document createdAt and updatedAt

- `userModel`

```js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // lowercase: true
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
      trim: true,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      default: 'male',
    },
    profilePicture: String,
    confirmed: Boolean,
  },
  {
    timestamps: true,
    strictQuery: true, // when true, Mongoose will only save fields that are defined in the schema. Any fields that are not defined in the schema will be ignored and not saved to the database.
  },
);

const userModel = mongoose.model.user || mongoose.model('user', userSchema);

export default userModel;
```
