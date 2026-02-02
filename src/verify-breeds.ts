import mongoose from 'mongoose';
import { Breed } from './lib/models/Breed.js';
import { schema } from './lib/graphql/schema.js';
import { graphql } from 'graphql';
import { config } from 'dotenv';
config();

// Fix for resolving modules in node if needed, though with vite it might differ. 
// We assume tsx or similar handles path aliases or we use relative paths.
// The file is placed in src/verify-breeds.ts

async function main() {
    if (!process.env.MONGO_URI) {
        console.error("No MONGO_URI in .env");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // 1. Initialize Breeds
    console.log("Running initializeBreeds...");
    const initQuery = `
        mutation {
            initializeBreeds {
                species
                label
                breeds
            }
        }
    `;
    const initResult = await graphql({ schema, source: initQuery });
    if (initResult.errors) {
        console.error("Init Errors:", initResult.errors);
    } else {
        console.log("Init Success. Count:", (initResult.data as any).initializeBreeds.length);
    }

    // 2. Query Breeds
    console.log("Running getBreeds...");
    const checkQuery = `
        query {
            getBreeds {
                species
                label
                breeds
            }
        }
    `;
    const checkResult = await graphql({ schema, source: checkQuery });
    if (checkResult.errors) {
        console.error("Check Errors:", checkResult.errors);
    } else {
        const breeds = (checkResult.data as any).getBreeds;
        console.log("Fetched Breeds Count:", breeds.length);
        console.log("Species found:", breeds.map((b: any) => b.species).join(", "));
    }

    // 3. Add Breed
    console.log("Running addBreedToSpecies...");
    const addQuery = `
        mutation {
            addBreedToSpecies(species: "dog", breedName: "SuperDog") {
                species
                breeds
            }
        }
    `;
    const addResult = await graphql({ schema, source: addQuery });
    if (addResult.errors) {
        console.error("Add Errors:", addResult.errors);
    } else {
        const dog = (addResult.data as any).addBreedToSpecies;
        if (dog.breeds.includes("SuperDog")) {
            console.log("Add Breed Success: SuperDog added to dog");
        } else {
            console.error("Add Breed Failed");
        }
    }

    await mongoose.disconnect();
}

main().catch(console.error);
