const { createClient } = require("redis");

const client = createClient({
    username: 'default',
    password: '7kqTVSeh94qSDSNK0GEBcgCqcNio7m40',
    socket: {
        host: 'redis-19865.c16.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 19865
    }
});

client
.on('error', err => console.log('Redis Client Error', err))
.on ("connect", ()=> console.log("Redis connected"));

client.connect();
module.exports = client;

// await client.set('foo', 'bar');
// const result = await client.get('foo');
// console.log(result)  // >>> bar
