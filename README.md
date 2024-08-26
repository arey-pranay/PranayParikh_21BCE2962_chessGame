<!-- This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details. -->

#### Clash Of Chess

- Hey, I am Pranay, and this is an assignment for HitWicket
- My task is to create a chess-like game, on the web, with websockets.
- To tell you in short words, imagine a chess and then we'll keep removing and adding stuff to get to my game.
- The grid is 5x5. There are 5 pieces on each side. Out of those 5, there are 3 Pawns and 2 Heroes.
- Pawns move Left Right Forward Backward, one step per move. Hero1 moves same directions as Pawns but 2 steps per move instead of 1. Hero2 moves diagonally, so forward-left, forward-right, backward-left, backward-right.
- The game ends when any player loses all 5 pieces.

###### How I made it ?

- I used Next.js for this. Coz it's a fullstack framework, and I have been using this for past few weeks for the project I'm doing at my internship.
-

###### How can you run this ?

- So, first just clone my repo using git clone ...
- Then install the node_modules (npm i)
- Then first start the server from the root directory by nodemon server.js
- And finally start the frontend by using "npm run dev"

###### Edge Cases and Difficulties

###### Future Scope (Original Ideas)

Since I have my exams going on rn, I couldn't implement a lot of things that I wanted to, so here are few of the stuff that I'd love to add:

- First of all, I wanna implement keyboard controls in this, like click on the piece and then use the arrow button to move, this is my foremost plan.

- Then I also wanna add a timer like chess, where the player whose timer runs out

- I also wanna add an undo option so that the player can undo there move ( a limited number of time ) before the opponent plays his/her move.
