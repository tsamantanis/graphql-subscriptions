const { ApolloServer, gql, PubSub, withFilter } = require('apollo-server');

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
        posts(channel: String!): [Post!]
        channels: [Channel!]!
    }

    type Mutation {
        addPost(channel: String!, message: String!): Post!
        addChannel(name: String!): Channel!
    }

    type Subscription {
        newPost(channel: String!): Post
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
        posts: (_, { channel }) => {
            const posts = channelData.filter(item => item.name === channel)[0].posts
			return  posts ? posts : []
		},
        channels: () => {
			return channelData
		}
	},
	Mutation: {
        addPost: (_, { channel, message }) => {
			const post = { message, date: new Date() }
			data.push(post)
            const updatedChannel = channelData.filter(item => item.name === channel)[0]
            if (updatedChannel)
                updatedChannel.posts.push(post)
			pubsub.publish('NEW_POST', { newPost: post, channel })
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
			subscribe: withFilter (
                () => pubsub.asyncIterator('NEW_POST'),
                (payload, variables) => {
                    return payload.channel === variables.channel
                },
            )
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