const typeDefs = `

type Account {
    id: ID!
    name: String
    email: String
    telephone: String
    password: String
    image: String    
}

type Saving {
    id: ID!
    name: String
    amount: Int
    target: Int
    color: String
    status: String
    reminder: String
}

type FrontPage {
    account: Account
    month: String
    year: String
    spend: Int
    averageCashOut: Int
    dailys: [Daily]
    recents: [Transaction]
    savings: [Saving]
}

type Daily {
    day: String
    CASH_IN: Int
    CASH_OUT: Int
}

type Transaction {
    amount: Int
    tags: [String]
    source: Saving
    type: String  
    createdAt: String
    id: ID 
}

type Query { 
    getFrontPage(account : ID!) : FrontPage
    getAccountDetails(account: ID!) : Account
}

type Mutation {
    newTarget(
        name: String!
        target: Int  
        color: String
        account: String
        reminder: String
    ) : Saving

    newTransaction(
        amount: Int
        tags: [String]
        source: String
        type: String
        account: String     
    ) : Transaction

    newInstallment(
        target: ID
        amount: Int        
    ) : Saving

    newAccount(
        name: String
        password: String
        telephone: String
        email: String
        image: String
    ): Account
}

`;

export default typeDefs;
