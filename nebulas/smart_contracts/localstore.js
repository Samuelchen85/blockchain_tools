'use strict';

class Rectangle {
    constructor() {
        // define fields stored to state trie.
        LocalContractStorage.defineProperties(this, {
            height: null,
            width: null,
        });
    }

    // init function.
    init(height, width) {
        this.height = parseInt(height);
        this.width = parseInt(width);
    }

    // calc area function.
    calcArea() {
        return this.height * this.width;
    }

    setHeight(height){
      this.height = parseInt(height);
    }

    setWidth(width){
      this.width = parseInt(width);
    }

    // verify function.
    verify(expected) {
        var expected_area = parseInt(expected);
        let area = this.calcArea();
        if (expected_area != area) {
            throw new Error("Error: expected " + expected_area + ", actual is " + area + ".");
        }
    }
}
