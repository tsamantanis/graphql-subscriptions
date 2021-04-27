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
    }

    type Mutation {
        addPost(message: String!): Post!
    }

    type Subscription {
        newPost: Post!
    }
`

const data = [
	{ message: 'hello world', date: new Date() }
]

const resolvers = {
	Query: {
        posts: () => {
			return data
		}
	},
	Mutation: {
        addPost: (_, { message }) => {
			const post = { message, date: new Date() }
			data.push(post)
			pubsub.publish('NEW_POST', { newPost: post })
			return post
		}
	},
	Subscription: {
		newPost: {
			subscribe: () => pubsub.asyncIterator('NEW_POST')
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