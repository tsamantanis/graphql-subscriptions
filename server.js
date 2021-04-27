const { ApolloServer, gql, PubSub } = require('apollo-server');

const pubsub = new PubSub();

const typeDefs = gql`
    type Post {
        message: String!
        date: String!
    }

    type Channel {
        name: String!
        posts: [Post!]
    }

    type Query {
        posts: [Post!]!
        channels: [Channel!]!
    }

    type Mutation {
        addPost(message: String!): Post!
        addChannel(name: String!): Channel!
    }

    type Subscription {
        newPost: Post!
        newChannel: Channel!
    }
`

const data = [
	{ message: 'hello world', date: new Date() }
]
const channelData = [
    {
        name: "channel1",
        posts: [data[0]]
    }
]

const resolvers = {
	Query: {
        posts: () => {
			return data
		},
        channels: () => {
			return channelData
		}
	},
	Mutation: {
        addPost: (_, { message }) => {
			const post = { message, date: new Date() }
			data.push(post)
			pubsub.publish('NEW_POST', { newPost: post })
			return post
		},
        addChannel: (_, { name }) => {
			const channel = { name, posts: [] }
			data.push(channel)
			pubsub.publish('NEW_CHANNEL', { newChannel: channel })
			return channel
		}
	},
	Subscription: {
		newPost: {
			subscribe: () => pubsub.asyncIterator('NEW_POST')
		},
        newChannel: {
			subscribe: () => pubsub.asyncIterator('NEW_CHANNEL')
		}
	}
}

const server = new ApolloServer({ 
	typeDefs, 
	resolvers 
});

server.listen().then(({ url }) => {
	console.log(`🚀 Server ready at ${ url }`);
});