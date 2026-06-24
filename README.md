# DJGPT API

## Description
This is the API for DJGPT, a chatbot that helps you find the best music sources for your needs. It uses an internal API to fetch data from various music sources and provides recommendations based on embedding.

## Technologies Used
- Node.js
- Express
- Apollo Server
- MongoDB

## Installation
1. Clone the repository:
```bash
git clone git@gitlab.com:dj-gpt/api.git
```
2. Navigate to the project directory:
```bash
cd api
```
3. Install dependencies:
```bash
npm install
```
4. Set up environment variables:
Use `.env.example` as a template to create your `.env` file and fill in the required values.

## Usage
Start the server:
```bash
make env
```
or 
```bash
make
```

And then go on http://localhost:8080/graphql to access the GraphQL playground.

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes.