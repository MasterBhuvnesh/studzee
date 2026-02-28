
import { useAuth } from '@clerk/clerk-expo';
import logger from './logger';

export const useLogTokenDev = () => {
    const { getToken } = useAuth();

    const logToken = async () => {
        if (process.env.NODE_ENV !== 'production') {
            const token = await getToken();
            logger.trace('Clerk JWT Token: ' + token);
        }
    };

    return logToken;
};
