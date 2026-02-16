import { Breed } from './models/Breed';
import { Species } from './models/Species';
import { Country } from './models/Country';
import { LoginImage } from './models/LoginImage';
import { initialBreeds } from './data/initialBreeds';
import { countries, COUNTRY_COUNT } from './data/countries';
import { getCountryFlag, isValidFlagEmoji } from './utils/countryFlag';

// Default login carousel images
const defaultLoginImages = [
    {
        url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1920&q=80',
        alt: 'Happy golden retriever',
        order: 0
    },
    {
        url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1920&q=80',
        alt: 'Cute orange cat',
        order: 1
    },
    {
        url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1920&q=80',
        alt: 'Adorable dalmatian puppy',
        order: 2
    },
    {
        url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=1920&q=80',
        alt: 'Beautiful tabby cat',
        order: 3
    },
    {
        url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1920&q=80',
        alt: 'Two dogs playing together',
        order: 4
    }
];

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

export const seedCountries = async () => {
    try {
        // Check if countries already exist
        const existingCount = await Country.countDocuments();
        if (existingCount > 0) {
            const existingCountries = await Country.find({}, { alpha2: 1, flag: 1 }).lean();
            const updates = existingCountries
                .filter((country: any) => !isValidFlagEmoji(country.flag))
                .map((country: any) => ({
                    updateOne: {
                        filter: { _id: country._id },
                        update: { $set: { flag: getCountryFlag(country.flag, country.alpha2) } }
                    }
                }));

            if (updates.length > 0) {
                await Country.bulkWrite(updates);
                console.log(`Repaired ${updates.length} country flags.`);
            }

            console.log(`Countries already seeded (${existingCount} countries). Skipping...`);
            return;
        }

        console.log(`Seeding database with ${COUNTRY_COUNT} countries...`);

        // Insert all countries
        await Country.insertMany(countries);

        console.log(`Successfully seeded ${COUNTRY_COUNT} countries!`);
    } catch (error) {
        console.error('Error seeding countries:', error);
    }
};

export const seedLoginImages = async () => {
    try {
        // Check if login images already exist
        const existingCount = await LoginImage.countDocuments();
        if (existingCount > 0) {
            console.log(`Login images already seeded (${existingCount} images). Skipping...`);
            return;
        }

        console.log(`Seeding database with ${defaultLoginImages.length} login images...`);

        // Insert all login images
        await LoginImage.insertMany(defaultLoginImages.map(img => ({
            ...img,
            isActive: true
        })));

        console.log(`Successfully seeded ${defaultLoginImages.length} login images!`);
    } catch (error) {
        console.error('Error seeding login images:', error);
    }
};

// Seed all data
export const seedAll = async () => {
    await seedBreeds();
    await seedCountries();
    await seedLoginImages();
};
