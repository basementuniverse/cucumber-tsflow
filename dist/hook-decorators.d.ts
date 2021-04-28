/**
 * A method decorator that marks the associated function as a 'Before Scenario' step. The function is
 * executed before each scenario.
 *
 * @param tag An optional tag.
 */
export declare function before(tag?: string): MethodDecorator;
/**
 * A method decorator that marks the associated function as a 'Before All Scenario' step. The function is
 * executed before all scenarios are executed.
 *
 * @param tag An optional tag.
 */
export declare function beforeAll(tag?: string): MethodDecorator;
/**
 * A method decorator that marks the associated function as an 'After Scenario' step. The function is
 * executed after each scenario.
 *
 * @param tag An optional tag.
 */
export declare function after(tag?: string): MethodDecorator;
/**
 * A method decorator that marks the associated function as an 'After All Scenario' step. The function is
 * executed after all scenarios are executed.
 *
 * @param tag An optional tag.
 */
export declare function afterAll(tag?: string): MethodDecorator;
//# sourceMappingURL=hook-decorators.d.ts.map