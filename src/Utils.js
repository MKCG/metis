Array.prototype.equals = function (other) {
    if (Array.isArray(other) === false || this.length !== other.length) {
        return false;
    }

    for (let i = 0; i < this.length; i++) {
        if (Array.isArray(this[i]) && Array.isArray(other[i])) {
            if (!this[i].equals(other[i])) {
                return false;
            }
        } else if (this[i] != other[i]) {
            return false;   
        }
    }

    return true;
}

Array.prototype.intersect = function(array) {
    let values = array.filter(function(id) {
        return this.indexOf(id) > -1;
    }, new Set(this));

    return values;
}


Set.prototype.clone = function() {
    let copy = new Set([...this]);
    return copy;
}

Set.prototype.intersect = function(other) {
    let intersection = new Set(),
        smallest,
        biggest;

    if (this.size < other.size) {
        smallest = this;
        biggest = other;
    } else {
        smallest = other;
        biggest = this;
    }

    for (var elem of smallest) {
        if (biggest.has(elem)) {
            intersection.add(elem);
        }
    }

    return intersection;
}

Set.prototype.union = function(other) {
    let union,
        smallest;

    if (this.size < other.size) {
        union = new Set(other);
        smallest = this;
    } else {
        union = new Set(this);
        smallest = other;
    }

    for (let elem of smallest) {
        union.add(elem);
    }

    return union;
}

Object.prototype.getNestedValue = function(keys) {
    if (typeof keys === 'string') {
        keys = keys.split('.');
    }

    let value = this;

    while ((key = keys.shift()) && value !== undefined) {
        value = value[key];
    }

    return value;
}


String.prototype.maxDiff = function(other, maxNb) {
    let smallest,
        biggest;

    if (this.length > other.length) {
        smallest = other;
        biggest = this;
    } else {
        smallest = this;
        biggest = other;
    }

    if (biggest.length - smallest.length > maxNb) {
        return false;
    }

    // smallest is a subset of biggest
    if (biggest.length <= (smallest.length + maxNb) && biggest.indexOf(smallest) !== -1) {
        return true;
    }

    if (smallest.length === biggest.length) {
        for (let i = 0; i < smallest.length; i++) {
            if (smallest[i] !== biggest[i] && --maxNb < 0) {
                return false;
            }
        }

        return true;
    }

    return smallest.levenshtein(biggest) <= maxNb;
}


String.prototype.levenshtein = function(other) {
    if (this.length == 0) {
        return other.length;
    }

    if (other.length == 0) {
        return this.length;
    }

    let matrix = [];

    for (let i = 0; i <= other.length; i++){
        matrix[i] = [i];
    }

    for(let j = 0; j <= this.length; j++){
        matrix[0][j] = j;
    }

    for (let i = 1; i <= other.length; i++) {
        for (let j = 1; j <= this.length; j++) {
            if (other[i-1] === this[j-1]) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i-1][j-1] + 1,        // substitution
                    Math.min(matrix[i][j-1] + 1, // insertion
                    matrix[i-1][j] + 1)          // deletion
                );
            }
        }
    }

    return matrix[other.length][this.length];
}
