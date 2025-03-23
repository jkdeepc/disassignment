import { Toy as Toy } from "../shared/type";
import { createItem } from "../shared/util";

export const Table: Toy[] = [
    createItem({
        Id: 'toy001',
        name: 'Toycar', 
        description: "a toycar",
        likeIt: true,
        rating: 9, 
    }),
    createItem({
        Id: 'toy002',
        name: 'Toydoll', 
        description: "a doll",
        likeIt: true,
        rating: 6, 
    }),
]
