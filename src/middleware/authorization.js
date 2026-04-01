// select role for users

// what can i access

// first authenticate
// sec authorize

export const authorization = (roles = []) => {
    return async (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            throw new Error("unAuthorized")
        }

        next()
    }
}