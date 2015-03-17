describe("Utilities", function() {
    it("should calculate contains correctly", function() {
        expect(SemiscreenExtension.Utilities.contain([100, 50], [50, 50])).toEqual([50, 25]);
        expect(SemiscreenExtension.Utilities.contain([50, 100], [50, 50])).toEqual([25, 50]);

        expect(SemiscreenExtension.Utilities.contain([100, 50], [55, 55], [5, 5])).toEqual([50, 25]);
        expect(SemiscreenExtension.Utilities.contain([50, 200], [100, 100])).toEqual([25, 100]);

        expect(SemiscreenExtension.Utilities.contain([50, 25], [100, 200])).toEqual([100, 50]);
        expect(SemiscreenExtension.Utilities.contain([25, 50], [200, 100])).toEqual([50, 100]);
    });
});
