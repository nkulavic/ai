import { renderLoggedInAuthorizeScreen, renderLoggedOutAuthorizeScreen, layout, parseApproveFormBody, renderAuthorizationApprovedContent, renderAuthorizationRejectedContent } from './utils';
import { GitHubHandler } from './github-handler';

export default new OAuthProvider({
    apiRoute: "/sse",
    apiHandler: MyMCP.mount("/sse"),
    defaultHandler: GitHubHandler,
    authorizeEndpoint: "/authorize",
    tokenEndpoint: "/token",
    clientRegistrationEndpoint: "/register",
}); 