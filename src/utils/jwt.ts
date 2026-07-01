import jwt from 'jsonwebtoken';
import "dotenv/config"

export const generateJWTToken = async (payload: any): Promise<string> =>{
    const token = jwt.sign(
        payload, 
        process.env.JWT_TOKEN!,
        {expiresIn: '4h'}
    )

    return token;
} 