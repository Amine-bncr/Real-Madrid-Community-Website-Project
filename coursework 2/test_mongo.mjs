import { MongoClient } from 'mongodb';

const url = 'mongodb+srv://Amine:amine123@cluster0.yhuge0o.mongodb.net';
const dbName = 'test1';                   

async function run() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const users = db.collection('users_example');

    // insert one document
    const insertResult = await users.insertOne({
      username: 'testuser',
      createdAt: new Date()
    });
    console.log('Inserted with _id =', insertResult.insertedId.toString());

    // find it back
    const found = await users.findOne({ username: 'testuser' });
    console.log('Found document:', found);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

run();