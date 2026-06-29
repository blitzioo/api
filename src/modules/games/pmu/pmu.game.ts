// import BaseGame, {GameData, TGameActionPayload} from "../base-game.js";
// import { Card, CardSuit } from "../shared/cards/cards.type.js"
// import { createDeck56 } from "../shared/cards/decks.js";
// import { shuffleDeck } from "../shared/cards/index.js";

// type PmuState = {
//     maxNumberReach: number
//     stepNumber: number
//     choices: Record<string, CardSuit>
//     position: Record<CardSuit, number>
//     sideCards: Card[]
//     deck: Card[]
//     started: boolean
// }

// const DEFAULT_STEP = 6;  

// export default class PmuGame extends BaseGame<PmuState> {

//     public constructor(data: GameData<PmuState>) {
//         const stepNumber = Number(data.options?.stepNumber ?? DEFAULT_STEP);

//         let deck = shuffleDeck(createDeck56().filter(card => card.rank !== "A"))
//         let sideCards: Card[] = [];
//         for (let i = 0; i < stepNumber; i++) {
//             if (deck.length !== 0) {
//                 sideCards.push(deck.pop()!);
//             }
//         }
//         super(data, {
//             stepNumber,
//             maxNumberReach: 0,
//             choices: {},
//             position: {
//                 clubs: 0,
//                 diamonds: 0,
//                 hearts: 0,
//                 spades: 0
//             },
//             deck,
//             sideCards,
//             started: false 
//         });

//         console.log(" INIT PMU GAME")
//     }

//     public async handleAction(playerId: string, action: string, payload: TGameActionPayload) {
//         console.log("ACTION FROM " + playerId, action, payload)
//         switch (action) {
//             case "play-round": {
//                 if (!this.getPlayer(playerId)?.isHost) {
//                     throw new Error("Only the host can play a round");
//                 }
//                 await this.playRound();
//                 break;
//             }

//             case "make-choice": {
//                 const { cardSuit } = payload as { cardSuit?: CardSuit };
//                 console.log(" ===================== ")
//                 console.log(playerId, action, payload);
//                 console.log(" =================== ")    
//                 if (!cardSuit || !Object.values(CardSuit).includes(cardSuit)) {
//                     throw new Error("Invalid or missing card suit");
//                 }

//                 const state = this.getState();

//                 if (state.started) throw Error('Game already start');

//                 state.choices[playerId] = cardSuit;
//                 await this.updateState(state);
//                 break;
//             }
//         }
//     }

//     public async initialize(): Promise<void> { }

//     private playRound() {
//         const state = this.getState();
//         if (state.deck.length === 0) {
//             this.broadcastCustomEvent("end", {
//                 state: this.getPublicState(),
//                 winner: this.getWinner()
//             })
//             this.endGame();
//             return;
//         }

//         if (!state.started) state.started = true;

//         const card = state.deck.pop()!;
        
//         const currentPosition = state.position[card.suit] + 1;
//         state.position[card.suit] = currentPosition;
        
//         if (currentPosition >= state.stepNumber){
//             this.broadcastCustomEvent("end", {
//                 state: this.getPublicState(),
//                 winner: this.getWinner()
//             });
//             this.endGame();
//             return;
//         }

//         if (currentPosition > state.maxNumberReach) {
//             const sideCard = state.sideCards[currentPosition];
//             state.position[sideCard.suit] = state.position[sideCard.suit] - 1;
           
//             state.maxNumberReach = currentPosition;
//         }

//         this.broadcast(this.getPublicState())
//     }

//     private getPublicState() {
//         const state = this.getState();

//         return {
//             maxNumberReach: state.maxNumberReach,
//             stepNumber: state.stepNumber,
//             position: state.position,
//             sideCards: state.sideCards[state.maxNumberReach],
//         }
//     }

//     private getWinner(): CardSuit {
//         const { position } = this.getState();

//         const [winningSuit] = Object.entries(position)
//             .reduce((best, current) => (current[1] > best[1] ? current : best));

//         return winningSuit as CardSuit;
//     }
// }