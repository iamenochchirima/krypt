// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleEdition is ERC1155, ERC1155Supply, ERC2981, Ownable, ReentrancyGuard {
    string public name;
    string public symbol;
    uint256 public mintPrice;
    uint256 public maxSupplyPerToken;
    bool public mintingEnabled;

    event MintingToggled(bool enabled);
    event MintPriceUpdated(uint256 newPrice);
    event Withdrawal(address indexed to, uint256 amount);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _uri,
        uint256 _maxSupplyPerToken,
        uint256 _mintPrice,
        uint96 royaltyBps,
        address royaltyRecipient
    ) ERC1155(_uri) Ownable(msg.sender) {
        name = _name;
        symbol = _symbol;
        maxSupplyPerToken = _maxSupplyPerToken;
        mintPrice = _mintPrice;
        mintingEnabled = true;
        _setDefaultRoyalty(royaltyRecipient, royaltyBps);
    }

    function mint(uint256 tokenId, uint256 quantity) external payable nonReentrant {
        require(mintingEnabled, "Minting is disabled");
        require(quantity > 0, "Quantity must be greater than 0");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");

        if (maxSupplyPerToken > 0) {
            require(totalSupply(tokenId) + quantity <= maxSupplyPerToken, "Exceeds max supply");
        }

        _mint(msg.sender, tokenId, quantity, "");
    }

    function mintBatch(uint256[] calldata tokenIds, uint256[] calldata quantities) external payable nonReentrant {
        require(mintingEnabled, "Minting is disabled");
        require(tokenIds.length == quantities.length, "Length mismatch");

        uint256 totalQuantity = 0;
        for (uint256 i = 0; i < quantities.length; i++) {
            totalQuantity += quantities[i];
            if (maxSupplyPerToken > 0) {
                require(totalSupply(tokenIds[i]) + quantities[i] <= maxSupplyPerToken, "Exceeds max supply");
            }
        }

        require(msg.value >= mintPrice * totalQuantity, "Insufficient payment");
        _mintBatch(msg.sender, tokenIds, quantities, "");
    }

    function ownerMint(address to, uint256 tokenId, uint256 quantity) external onlyOwner {
        if (maxSupplyPerToken > 0) {
            require(totalSupply(tokenId) + quantity <= maxSupplyPerToken, "Exceeds max supply");
        }
        _mint(to, tokenId, quantity, "");
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
        emit MintPriceUpdated(_mintPrice);
    }

    function toggleMinting() external onlyOwner {
        mintingEnabled = !mintingEnabled;
        emit MintingToggled(mintingEnabled);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(owner(), balance);
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
