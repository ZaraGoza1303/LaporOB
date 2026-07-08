import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'LaporOB API Documentation',
            version: '1.0.0'
        }
    },
    apis: ['./src/routes/*.ts'],
}

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;