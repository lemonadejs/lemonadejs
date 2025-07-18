/*describe('Path utility', () => {

    // Helper to create a fresh test object
    const createTestObject = () => ({
        address: {
            number: { test: 123 },
            zip: 123,
        },
        empty: {},
        nullProp: null,
        undefinedProp: undefined,
        nonObject: 456,
        array: [1, { name: 'item' }, 3],
    });

    // === Write Mode Tests ===
    it('Write to existing deep path', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'address.number.test', 999)).toBe(true);
        expect(obj.address.number.test).toBe(999);
    });

    it('Write to new deep path', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'address.city.name', 'New York')).toBe(true);
        expect(obj.address.city.name).toBe('New York');
    });

    it('Write to null property', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'nullProp.zip', 12345)).toBe(true);
        expect(obj.nullProp.zip).toBe(12345);
    });

    it('Write to undefined property', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'undefinedProp.name', 'test')).toBe(true);
        expect(obj.undefinedProp.name).toBe('test');
    });

    it('Write to non-object property', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'nonObject.prop', 'value')).toBe(true);
        expect(obj.nonObject.prop).toBe('value');
    });

    it('Write to single level property', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'newProp', 'value')).toBe(true);
        expect(obj.newProp).toBe('value');
    });

    it('Write to array element', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'array.1.name', 'modified')).toBe(true);
        expect(obj.array[1].name).toBe('modified');
    });

    it('Write with multiple levels of new properties', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'new.deep.nested.prop', 'deep')).toBe(true);
        expect(obj.new.deep.nested.prop).toBe('deep');
    });

    it('Write zero value', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'address.number.test', 0)).toBe(true);
        expect(obj.address.number.test).toBe(0);
    });

    it('Write false value', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'address.number.test', false)).toBe(true);
        expect(obj.address.number.test).toBe(false);
    });

    // === Read Mode Tests ===
    it('Read existing deep path', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'address.number.test')).toBe(123);
    });

    it('Read non-existent path', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'address.nonexistent')).toBe(undefined);
    });

    it('Read null property', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'nullProp')).toBe(null);
    });

    it('Read undefined property', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'undefinedProp')).toBe(undefined);
    });

    it('Read single level property', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'nonObject')).toBe(456);
    });

    it('Read from array', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'array.1.name')).toBe('item');
    });

    it('Read path through null', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'nullProp.something')).toBe(undefined);
    });

    it('Read path through undefined', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'undefinedProp.something')).toBe(undefined);
    });

    // === Delete Mode Tests ===
    it('Delete existing property', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'address.number.test', undefined, true)).toBe(true);
        expect(obj.address.number.hasOwnProperty('test')).toBe(false);
    });

    it('Delete non-existent property', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'address.nonexistent', undefined, true)).toBe(true);
    });

    it('Delete single level property', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'nonObject', undefined, true)).toBe(true);
        expect(obj.hasOwnProperty('nonObject')).toBe(false);
    });

    // === Edge Cases ===
    it('Handle empty path', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, '')).toBe(false);
    });

    it('Handle path with only dots', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, '...')).toBe(false);
    });

    it('Handle single dot path', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, '.')).toBe(false);
    });

    it('Handle root object access', () => {
        let obj = createTestObject();
        expect(lemonade.Path.call(obj, 'address')).toBe(obj.address);
    });

});*/