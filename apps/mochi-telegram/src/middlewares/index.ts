import { middleware as parseArgument } from "./parse-command-argument";
import { middleware as logMessage } from "./log-message";
import { middleware as getChatData } from "./get-chat-data";

export default [parseArgument, logMessage, getChatData];
