import { Breed } from './models/Breed';
import { Species } from './models/Species';
import { initialBreeds } from './data/initialBreeds';

export const seedBreeds = async () => {
    try {
        // CLEAR DATABASE
        // Since we are refactoring, we drop existing collections to remove legacy indexes
        // and ensure a clean slate.
        await Species.collection.drop().catch(() => { });
        await Breed.collection.drop().catch(() => { });

        console.log('Seeding database with Species and Breeds...');

        for (const [speciesKey, data] of Object.entries(initialBreeds)) {
            // 1. Create Species
            const newSpecies = await Species.create({
                name: speciesKey,
                label: data.label
            });

            console.log(`Created Species: ${data.label}`);

            // 2. Create Breeds linked to this Species
            if (data.breeds && data.breeds.length > 0) {
                const breedDocs = data.breeds.map(breedName => ({
                    name: breedName,
                    species: newSpecies._id
                }));

                await Breed.insertMany(breedDocs);
                console.log(`  - Added ${breedDocs.length} breeds for ${data.label}`);
            }
        }

        console.log('Database seeding completed successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};
