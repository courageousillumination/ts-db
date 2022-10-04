export interface SelectToken { type: 'select' }
export interface FromToken { type: 'from' }
export interface InsertToken { type: 'insert' }
export interface IntoToken { type: 'into' }
export interface LeftParenToken { type: 'leftParen' }
export interface RightParenToken { type: 'rightParen' }
export interface Identifier { type: 'identifier', value: string }

export type Token = SelectToken | FromToken | Identifier | InsertToken | IntoToken | LeftParenToken | RightParenToken