import { Component } from '@angular/core';
import { Product } from '../product';
import { Observable, OperatorFunction, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { ProductService } from '../product.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { RecommendationService } from '../recommendation.service';
import { Recommendations } from '../recommendations';
import { ResultComponent } from '../result/result.component';
import { ResultService } from '../result.service';
import { SuggestedService } from '../suggested.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  entryComponents: [ResultComponent]
})
export class SearchComponent {
  title = 'product-recommender-angular';
  searchText = '';

  public model: any;
  public products: Product[] = [];
  public selectedProduct: Product | undefined;
  public recommendations! : Recommendations;
  public recommendationsByUnit! : Recommendations;
  public recommendationsByRating! : Recommendations;
  public suggestions! : Recommendations;
  public recommendedProducts : Product[] = [];
  public recommendedProductsByUnit : Product[] = [];
  public recommendedProductsByRating : Product[] = [];
  public suggestedProducts : Product[] = [];

  public search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 2
          ? []
          : ((this.products ?? []).filter((product) => product.productName.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10)).map((product) => product.productName)
      )
    );

  constructor(private resultService: ResultService, private recommendationService: RecommendationService, private productService: ProductService, private suggestedService: SuggestedService){}
  ngOnInit(): void {
    this.getProducts();
  }

  public getProducts(): void {
    this.productService.getProducts().subscribe(
      (response: Product[]) => {
        this.products = response;
      },
      (error: HttpErrorResponse) => {
        alert(error.message);
      }
    );
  }

  public onSelect(event: NgbTypeaheadSelectItemEvent): void {
    this.selectedProduct = this.products[this.products.findIndex(product => product.productName === event.item)]
    this.recommendationService.getRecommendations(this.selectedProduct.productID.toString())
      .subscribe(
        (data: Recommendations) => {
          this.recommendations = data;
          this.recommendedProducts = this.products.filter(product => this.recommendations.item_ids.includes(Number(product.productID)))
          this.resultService.updateRecommendedProducts(this.recommendedProducts);
        },
        (error) => {
          console.error(error);
        }
      );
      this.recommendationService.getRecommendationsByUnit(this.selectedProduct.productID.toString())
      .subscribe(
        (data: Recommendations) => {
          this.recommendationsByUnit = data;
          this.recommendedProductsByUnit = this.products.filter(product => this.recommendationsByUnit.item_ids.includes(Number(product.productID)))
          this.resultService.updateRecommendedProductsByUnit(this.recommendedProductsByUnit);
        },
        (error) => {
          console.error(error);
        }
      );
      this.recommendationService.getRecommendationsByRating(this.selectedProduct.productID.toString())
      .subscribe(
        (data: Recommendations) => {
          this.recommendationsByRating = data;
          this.recommendedProductsByRating = this.products.filter(product => this.recommendationsByRating.item_ids.includes(Number(product.productID)))
          this.resultService.updateRecommendedProductsByRating(this.recommendedProductsByRating);
        },
        (error) => {
          console.error(error);
        }
      );
      this.suggestedService.getSuggestedProducts(this.selectedProduct.productID.toString())
      .subscribe(
        (data: Recommendations) => {
          this.suggestions = data;
          this.suggestedProducts = this.products.filter(product => this.suggestions.item_ids.includes(Number(product.productID)))
          this.resultService.updateSuggestedProducts(this.suggestedProducts);
        },
        (error) => {
          console.error(error);
        }
      );
  }
}