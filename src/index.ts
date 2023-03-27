// Import the 'path' module to work with file and directory paths
import path from "path"

// Destructure process.argv to get the example name and any additional arguments
// process.argv contains command-line arguments as an array
const [exampleName, ...args] = process.argv.slice(2)

// Log the example name and arguments to the console
console.log(exampleName, ...args)

// Get the current directory's name by using path.dirname and the import.meta.url
const __dirname = path.dirname(new URL(import.meta.url).pathname)

// Declare a variable to store the runExample function
let runExample

// Use a dynamic import to load the specified example module from the current directory
import(path.join(__dirname, exampleName))
  .then((module) => {
    // Assign the run function exported by the module to runExample
    runExample = module.run

    // Execute the runExample function
    runExample()
  })
  .catch(() => {
    // If an error occurs while loading the example module, throw a custom error message
    throw new Error(`Could not load example ${exampleName}`)
  })
